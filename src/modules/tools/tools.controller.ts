import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { ToolConfigDto, ToolConfigResponseDto } from './dto/tools.dto';
import { ToolsService } from './tools.service';
import { ClerkAuthGuard } from 'src/auth/clerk-auth-guard';

@ApiTags('tools')
@Controller('tools')
@UseGuards(ClerkAuthGuard)
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tool configurations' })
  @ApiOkResponse({
    description: 'The tool configurations have been successfully retrieved.',
    type: [ToolConfigResponseDto],
  })
  async getAllLLMModels(): Promise<ToolConfigResponseDto[]> {
    return this.toolsService.getAllToolsConfig();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tool configuration' })
  @ApiCreatedResponse({
    type: ToolConfigResponseDto,
    description: 'The tool configuration has been successfully created.',
  })
  @ApiBody({
    type: ToolConfigDto,
    description: 'The tool configuration data to create.',
  })
  async create(
    @Body() createToolConfigDto: ToolConfigDto,
  ): Promise<ToolConfigResponseDto> {
    return this.toolsService.createToolConfig(createToolConfigDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tool configuration by ID' })
  @ApiOkResponse({
    type: ToolConfigResponseDto,
    description: 'The tool configuration has been successfully retrieved.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the tool configuration to retrieve.',
  })
  @ApiResponse({ status: 404, description: 'Tool configuration not found' }) // Example of adding a 404 response
  async findOne(@Param('id') id: string): Promise<ToolConfigResponseDto> {
    return this.toolsService.getToolConfigById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing tool configuration' })
  @ApiOkResponse({
    type: ToolConfigResponseDto,
    description: 'The tool configuration has been successfully updated.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the tool configuration to update.',
  })
  @ApiBody({
    type: ToolConfigDto,
    description: 'The updated tool configuration data.',
  })
  @ApiResponse({ status: 404, description: 'Tool configuration not found' }) // Example of adding a 404 response
  async update(
    @Param('id') id: string,
    @Body() updateToolConfigDto: ToolConfigDto,
  ): Promise<ToolConfigResponseDto> {
    return this.toolsService.updateToolConfig(id, updateToolConfigDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tool configuration by ID' })
  @ApiOkResponse({
    description: 'The tool configuration has been successfully deleted.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the tool configuration to delete.',
  })
  @ApiResponse({
    status: 204,
    description: 'Tool configuration deleted successfully',
  }) // Indicate success with 204
  @ApiResponse({ status: 404, description: 'Tool configuration not found' }) // Example of adding a 404 response
  async remove(@Param('id') id: string): Promise<void> {
    return this.toolsService.deleteToolConfig(id);
  }
}
